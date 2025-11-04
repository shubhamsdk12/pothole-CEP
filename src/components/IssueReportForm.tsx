import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import { Camera, MapPin, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'streetlight', label: 'Broken Streetlight', icon: '💡' },
  { value: 'garbage', label: 'Garbage Pile', icon: '🗑️' },
  { value: 'drainage', label: 'Drainage Issue', icon: '💧' },
  { value: 'signage', label: 'Damaged Signage', icon: '🚧' },
  { value: 'road_damage', label: 'Road Damage', icon: '🛣️' },
  { value: 'other', label: 'Other', icon: '📋' }
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', description: 'Minor inconvenience', color: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', description: 'Needs attention', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', description: 'Urgent fix required', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', description: 'Safety hazard', color: 'bg-red-500' }
];

const IssueReportForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { location, loading: locationLoading, getCurrentLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('pothole');
  const [urgency, setUrgency] = useState('medium');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user || !location) {
      toast({
        title: 'Missing information',
        description: 'Please select a photo and allow location access',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      // Upload photo to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pothole-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pothole-photos')
        .getPublicUrl(fileName);

      // Run detection on the uploaded image (only gate pothole type)
      if (issueType === 'pothole') {
        const detectRes = await fetch('http://localhost:8000/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: publicUrl })
        });

        if (!detectRes.ok) {
          await supabase.storage.from('pothole-photos').remove([fileName]);
          const errText = await detectRes.text();
          throw new Error(`Detection service error: ${errText}`);
        }

        const detectJson = await detectRes.json();
        if (!detectJson.detected) {
          await supabase.storage.from('pothole-photos').remove([fileName]);
          toast({
            title: 'No pothole detected',
            description: 'Please upload a clear pothole image.',
            variant: 'destructive'
          });
          setUploading(false);
          return;
        }
      }

      // Save report to database
      const { error: dbError } = await supabase
        .from('pothole_reports')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          severity: urgency,
          description,
          issue_type: issueType,
          urgency,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: 'Report submitted! 🎉',
        description: 'You earned 10 credits! Your report will be processed soon.'
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setIssueType('pothole');
      setUrgency('medium');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive'
      });
    }

    setUploading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Report an Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Issue Type Selection */}
        <div className="space-y-2">
          <Label>Issue Type</Label>
          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Urgency Level */}
        <div className="space-y-2">
          <Label>Urgency Level</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {URGENCY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${level.color}`} />
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Photo Selection */}
        <div className="space-y-3">
          <Label>Photo Evidence</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Issue preview"
                className="w-full h-48 object-cover rounded-md border"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCameraCapture}
                className="h-24 flex-col"
              >
                <Camera className="h-6 w-6 mb-1" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 flex-col"
              >
                <Upload className="h-6 w-6 mb-1" />
                Upload Photo
              </Button>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Location</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              <MapPin className="h-4 w-4 mr-1" />
              {locationLoading ? 'Getting...' : 'Get Location'}
            </Button>
          </div>
          {location && (
            <div className="p-2 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Location captured</span>
              </div>
              <p className="text-muted-foreground">{location.address}</p>
              <p className="text-xs text-muted-foreground">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Credit Info */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Badge className="mt-0.5">+10 Credits</Badge>
            <p className="text-sm text-muted-foreground">
              You'll earn 10 credits for this report, plus 10 more when it's resolved!
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !location || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Submitting Report...' : 'Submit Report & Earn Credits'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default IssueReportForm;
